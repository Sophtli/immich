import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { parse } from 'node:path';
import { AccessCore } from 'src/cores/access.core';
import { StorageCore } from 'src/cores/storage.core';
import { AssetIdsDto } from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { DownloadArchiveInfo, DownloadInfoDto, DownloadResponseDto } from 'src/dtos/download.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import { Permission } from 'src/enum';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ImmichReadStream, IStorageRepository } from 'src/interfaces/storage.interface';
import { HumanReadableSize } from 'src/utils/bytes';
import { usePagination } from 'src/utils/pagination';
import { getPreferences } from 'src/utils/preferences';

@Injectable()
export class DownloadService {
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
    this.logger.setContext(DownloadService.name);
  }

  async getDownloadInfo(auth: AuthDto, dto: DownloadInfoDto): Promise<DownloadResponseDto> {
    const targetSize = dto.archiveSize || HumanReadableSize.GiB * 4;
    const archives: DownloadArchiveInfo[] = [];
    let archive: DownloadArchiveInfo = { size: 0, assetIds: [] };

    const preferences = getPreferences(auth.user);

    const assetPagination = await this.getDownloadAssets(auth, dto);
    for await (const assets of assetPagination) {
      // motion part of live photos
      const motionIds = assets.map((asset) => asset.livePhotoVideoId).filter((id): id is string => !!id);
      if (motionIds.length > 0) {
        const motionAssets = await this.assetRepository.getByIds(motionIds, { exifInfo: true });
        for (const motionAsset of motionAssets) {
          if (
            !StorageCore.isAndroidMotionPath(motionAsset.originalPath) ||
            preferences.download.includeEmbeddedVideos
          ) {
            assets.push(motionAsset);
          }
        }
      }

      for (const asset of assets) {
        archive.size += Number(asset.exifInfo?.fileSizeInByte || 0);
        archive.assetIds.push(asset.id);

        if (archive.size > targetSize) {
          archives.push(archive);
          archive = { size: 0, assetIds: [] };
        }
      }

      if (archive.assetIds.length > 0) {
        archives.push(archive);
      }
    }

    let totalSize = 0;
    for (const archive of archives) {
      totalSize += archive.size;
    }

    return { totalSize, archives };
  }

  async downloadArchive(auth: AuthDto, dto: AssetIdsDto): Promise<ImmichReadStream> {
    await this.access.requirePermission(auth, Permission.ASSET_DOWNLOAD, dto.assetIds);

    const zip = this.storageRepository.createZipStream();
    const assets = await this.assetRepository.getByIds(dto.assetIds);
    const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
    const paths: Record<string, number> = {};

    for (const assetId of dto.assetIds) {
      const asset = assetMap.get(assetId);
      if (!asset) {
        continue;
      }

      const { originalPath, originalFileName } = asset;

      let filename = originalFileName;
      const count = paths[filename] || 0;
      paths[filename] = count + 1;
      if (count !== 0) {
        const parsedFilename = parse(originalFileName);
        filename = `${parsedFilename.name}+${count}${parsedFilename.ext}`;
      }

      let realpath = originalPath;
      try {
        realpath = await this.storageRepository.realpath(originalPath);
      } catch {
        this.logger.warn('Unable to resolve realpath', { originalPath });
      }

      zip.addFile(realpath, filename);
    }

    void zip.finalize();

    return { stream: zip.stream };
  }

  private async getDownloadAssets(auth: AuthDto, dto: DownloadInfoDto): Promise<AsyncGenerator<AssetEntity[]>> {
    const PAGINATION_SIZE = 2500;

    if (dto.assetIds) {
      const assetIds = dto.assetIds;
      await this.access.requirePermission(auth, Permission.ASSET_DOWNLOAD, assetIds);
      const assets = await this.assetRepository.getByIds(assetIds, { exifInfo: true });
      return usePagination(PAGINATION_SIZE, () => ({ hasNextPage: false, items: assets }));
    }

    if (dto.albumId) {
      const albumId = dto.albumId;
      await this.access.requirePermission(auth, Permission.ALBUM_DOWNLOAD, albumId);
      return usePagination(PAGINATION_SIZE, (pagination) => this.assetRepository.getByAlbumId(pagination, albumId));
    }

    if (dto.userId) {
      const userId = dto.userId;
      await this.access.requirePermission(auth, Permission.TIMELINE_DOWNLOAD, userId);
      return usePagination(PAGINATION_SIZE, (pagination) =>
        this.assetRepository.getByUserId(pagination, userId, { isVisible: true }),
      );
    }

    throw new BadRequestException('assetIds, albumId, or userId is required');
  }
}

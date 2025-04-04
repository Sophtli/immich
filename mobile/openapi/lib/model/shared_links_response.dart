//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedLinksResponse {
  /// Returns a new [SharedLinksResponse] instance.
  SharedLinksResponse({
    this.enabled = true,
    this.sidebarWeb = false,
  });

  bool enabled;

  bool sidebarWeb;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedLinksResponse &&
    other.enabled == enabled &&
    other.sidebarWeb == sidebarWeb;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode) +
    (sidebarWeb.hashCode);

  @override
  String toString() => 'SharedLinksResponse[enabled=$enabled, sidebarWeb=$sidebarWeb]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
      json[r'sidebarWeb'] = this.sidebarWeb;
    return json;
  }

  /// Returns a new [SharedLinksResponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedLinksResponse? fromJson(dynamic value) {
    upgradeDto(value, "SharedLinksResponse");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedLinksResponse(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        sidebarWeb: mapValueOfType<bool>(json, r'sidebarWeb')!,
      );
    }
    return null;
  }

  static List<SharedLinksResponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedLinksResponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedLinksResponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedLinksResponse> mapFromJson(dynamic json) {
    final map = <String, SharedLinksResponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedLinksResponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedLinksResponse-objects as value to a dart map
  static Map<String, List<SharedLinksResponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedLinksResponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedLinksResponse.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
    'sidebarWeb',
  };
}


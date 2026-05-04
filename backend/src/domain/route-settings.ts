export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type LabeledCoordinate = Coordinate & {
  label: string;
};

export type RouteSettings = {
  origin: LabeledCoordinate;
  destination: LabeledCoordinate;
};

export function validateRouteSettings(routeSettings: RouteSettings): RouteSettings {
  return {
    origin: validateLabeledCoordinate(routeSettings.origin, "origin"),
    destination: validateLabeledCoordinate(routeSettings.destination, "destination")
  };
}

function validateLabeledCoordinate(coordinate: LabeledCoordinate, fieldName: string): LabeledCoordinate {
  const label = coordinate.label.trim();

  if (!label) {
    throw new Error(`${fieldName} label is required`);
  }

  if (!Number.isFinite(coordinate.latitude) || coordinate.latitude < -90 || coordinate.latitude > 90) {
    throw new Error(`${fieldName} latitude must be between -90 and 90`);
  }

  if (!Number.isFinite(coordinate.longitude) || coordinate.longitude < -180 || coordinate.longitude > 180) {
    throw new Error(`${fieldName} longitude must be between -180 and 180`);
  }

  return {
    label,
    latitude: coordinate.latitude,
    longitude: coordinate.longitude
  };
}

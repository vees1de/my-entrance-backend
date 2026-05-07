import { Injectable } from '@nestjs/common';

type StreetLike = { name: string };
type BuildingLike = { number: string; floorsTotal: number; street?: StreetLike | null };
type EntranceLike = {
  number: number;
  building?: BuildingLike | null;
};

@Injectable()
export class AddressService {
  formatAddress(entrance: EntranceLike) {
    const building = entrance.building;
    const street = building?.street;
    if (!building || !street) return '';
    return `${street.name}, д. ${building.number}`;
  }

  serializeEntrance(entrance: EntranceLike & { id: string; building?: BuildingLike | null }) {
    return {
      id: entrance.id,
      number: entrance.number,
      address: this.formatAddress(entrance),
      streetName: entrance.building?.street?.name ?? null,
      buildingNumber: entrance.building?.number ?? null,
      entranceNumber: entrance.number,
      floorsTotal: entrance.building?.floorsTotal ?? null,
    };
  }
}

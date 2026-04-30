import { IsDefined } from "class-validator";

export class UpdateSettingDto {
  @IsDefined({ message: 'El valor es requerido' })
  value: unknown;
}

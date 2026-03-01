export interface Const {
  id: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConstDto {
  key: string;
  value: string;
}

export interface UpdateConstDto {
  key?: string;
  value?: string;
}

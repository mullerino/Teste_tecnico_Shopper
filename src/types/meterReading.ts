export interface UploadMeterReadingRequest {
  image: string;
  customer_code: string;
  measure_datetime: Date;
  measure_type: 'WATER' | 'GAS';
}

export interface Measure{
  measure_uuid: string;
  measure_datetime: Date;
  measure_type: 'WATER' | 'GAS';
  has_confirmed: boolean;
  image_url: string;
  customer_code: string;
}

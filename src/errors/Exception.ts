export default class Exception {
  msg: string;
  code: number;
  data: Record<string, unknown> | null = null;

  constructor(code: number, msg?: string, data?: Record<string, unknown>) {
    this.msg = msg ?? '';
    this.code = code;
    this.data = data || null;
  }
}

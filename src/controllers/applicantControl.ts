import type { Response, Request } from "express";
import * as excel from "exceljs";
const applicantControl = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ data_error: "No file uploaded" });
  }
  const file: Express.Multer.File = req.file;
  const workbook = new excel.Workbook();
  await workbook.xlsx.load(file.buffer as any);

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    return res.status(500).json({ server_error: "Internal server error" });
  }
  const headers: string[] = [];
  const file_content_json: any[] = [];
  const header_row = worksheet.getRow(1);
  header_row.eachCell({ includeEmpty: false }, (cell) => {
    headers.push(cell.value?.toString() || "");
  });
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const rowData: { [key: string]: any } = {};
    const headerName = headers[rowNumber - 1];
    if (!headerName) return;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      if (headers) {
        const index = headers[colNumber - 1];
        if (!index) return;
        rowData[index] = cell.value?.toString();
        file_content_json.push(rowData);
      }
    });
  })
};
export default applicantControl;

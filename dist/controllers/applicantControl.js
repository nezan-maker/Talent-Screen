import * as excel from "exceljs";
const applicantControl = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ data_error: "No file uploaded" });
    }
    const file = req.file;
    const workbook = new excel.Workbook();
    await workbook.xlsx.load(file.buffer);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
        return res.status(500).json({ server_error: "Internal server error" });
    }
    const headers = [];
    const file_content_json = [];
    const header_row = worksheet.getRow(1);
    header_row.eachCell({ includeEmpty: false }, (cell) => {
        headers.push(cell.value?.toString() || "");
    });
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1)
            return;
        const rowData = {};
        const headerName = headers[rowNumber - 1];
        if (!headerName)
            return;
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            if (headers) {
                const index = headers[colNumber - 1];
                if (!index)
                    return;
                rowData[index] = cell.value?.toString();
                file_content_json.push(rowData);
            }
        });
    });
    for (let i = 0; i < file_content_json.length; i++) {
        let current_json = file_content_json[i];
        current_json.skills.
        ;
    }
};
export default applicantControl;
//# sourceMappingURL=applicantControl.js.map
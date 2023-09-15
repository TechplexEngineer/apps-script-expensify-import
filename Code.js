function UpdateData() {
  const reportFileName = exportExpensifyReport();
  const csvContent = downloadReport(reportFileName);

  const csvData = Utilities.parseCsv(csvContent);
  const firstRow = csvData[0];
  
  const colToSplit = firstRow.indexOf("Description")
  for (const [idx, row] of csvData.entries()) {
    if (idx == 0) {
      row.push("Order Id");
      continue;
    }
    const [desc, orderId] = row[colToSplit].split(" | ")
    row[colToSplit] = desc;
    row.push(orderId);
  }
  console.log(JSON.stringify(csvData))

  writeDataToSheet(csvData, "Report");
}

/**
 * Triggered whenever the spreadheet is opened
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('Expensify Data');
  menu.addItem('Update Expensify Data', 'UpdateData');
  menu.addToUi();

  UpdateData();
}



function writeDataToSheet(data, sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  sheet.clearContents();
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
}

const template = `
<#if addHeader>
  Timestamp,Merchant,Amount,Category,Description,Receipt,Report Title<#lt>
</#if>
<#list reports as report>
  <#list report.transactionList as expense>
    <#if expense.modifiedMerchant?has_content>
      <#assign merchant = expense.modifiedMerchant>
    <#else>
      <#assign merchant = expense.merchant>
    </#if>
    <#if expense.convertedAmount?has_content>
      <#assign amount = expense.convertedAmount/100>
    <#elseif expense.modifiedAmount?has_content>
      <#assign amount = expense.modifiedAmount/100>
    <#else>
      <#assign amount = expense.amount/100>
    </#if>
    <#if expense.modifiedCreated?has_content>
      <#assign created = expense.modifiedCreated>
    <#else>
      <#assign created = expense.created>
    </#if>
    \${created},<#t>
    \${merchant},<#t>
    \${amount},<#t>
    \${expense.category},<#t>
    \${expense.comment},<#t>
    \${expense.receiptObject.url},<#t>
    \${report.reportName}<#lt>
  </#list>
</#list>`

function exportExpensifyReport() {
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };

    // 2. Use the API to get a list of available reports.
    const reportsUrl = 'https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations';
    const reportsPayload = {
        requestJobDescription: JSON.stringify({
            type: 'file',
            credentials,
            onReceive: {
                "immediateResponse": [
                    "returnRandomFileName"
                ]
            },
            inputSettings: {
                "type": "combinedReportData",
                "filters": {
                    //"reportIDList": "3374773629240085"
                    startDate: "2023-08-01" // fyscal year start
                }
            },
            "outputSettings": {
                "fileExtension": "csv"
            }
        }),
        template: template
    };
    const reportsResponse = UrlFetchApp.fetch(reportsUrl, {
        method: 'post',
        headers,
        payload: reportsPayload,
    });
    const reportFileName = reportsResponse.getContentText();
    return reportFileName;
}

// Use the API to export the report as a file.
function downloadReport(reportFileName) {
  const exportUrl = 'https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations';
  const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
  };
  const exportPayload = {
      requestJobDescription: JSON.stringify({
          type: 'download',
          credentials,
          "fileName": reportFileName, //"exportc111111d-a1a1-a1a1-a1a1-d1111111f.csv",
          "fileSystem": "integrationServer"
      }),
  };
  const exportResponse = UrlFetchApp.fetch(exportUrl, {
      method: 'post',
      headers,
      payload: exportPayload,
  });
  return exportResponse.getContentText();
}














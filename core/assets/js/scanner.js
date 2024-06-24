

$(document).ready(async function () {

  const startScanning = async () => {
    try {
      const barcodeData = await ipcRenderer.ScanBarcode();
      console.log("Scanned barcode:", barcodeData);
      // Process the barcode data here (e.g., display, send to server)
    } catch (err) {
      console.error("Scanning error:", err.message);
      // Display an error message to the user
    }
  };

  startScanning()

});



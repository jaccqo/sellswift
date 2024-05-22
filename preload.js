
const { contextBridge, ipcRenderer,remote } = require('electron');

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, args) => {
    ipcRenderer.send(channel, args);
  },
  on: (channel, callback) => {
      ipcRenderer.on(channel, (event, ...args) => callback(event, ...args));
  },

  Getloggeduser: () => ipcRenderer.invoke("get/cookie"),


  Insertinventory: (item) => ipcRenderer.invoke("insertItem",item),

  DeleteInventory : (inventoryid)=> ipcRenderer.invoke("Inventorydelete",inventoryid),

  SearchInventory:(barcode_or_name_or_category) => ipcRenderer.invoke("SearchInventory",barcode_or_name_or_category),

  GetUser:() => ipcRenderer.invoke("getuser"),

  SetTheme:(theme) => ipcRenderer.invoke("SetTheme",theme),

  getTheme:()=> ipcRenderer.invoke("getTheme"),

  returnBase64file:(file_path)=> ipcRenderer.invoke("returnBase64file",file_path)


});


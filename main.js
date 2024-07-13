const { app, BrowserWindow, ipcMain, session, autoUpdater } = require("electron");
const axios = require("axios");
const insert_axios = require("axios");
const fs = require('fs').promises;

const path = require("path");

const { error } = require("console");


let mainWindow;

let base_url="http://172.20.10.2:5000";


insert_axios.interceptors.response.use(
  response => response.data,
  error => {
    // Handle errors here
    return Promise.reject(error);
  }
);

async function get_session_cookie() {
  const cookies = await session.defaultSession.cookies.get({});

  let cookieValue = null;
  let organization = null;

  if (cookies.length > 0) {
    cookieValue = cookies[0].value;
    if (cookies.length > 1) {
      organization = cookies[1].value;


    }

  }

  return [organization, cookieValue];
}




// CRUD functions

// Insert operation with barcode and _id
async function insertItem(item) {

  try {

    // Get session cookies
    const sessioncookies = await get_session_cookie();

    if (sessioncookies) {
      // Insert on server using the local lastID as _id and additional fields
      const response = await insert_axios.post(`${base_url}/api/items`, {
        ...item,

        organization: sessioncookies[0],
        created_by: sessioncookies[1]

      });

      return response;
    } else {
      throw new Error("Local ID not generated or session cookies not found");
    }
  } catch (error) {
    console.error('Error inserting item:', error);
    throw error;
  }
}




// Read operation
async function getAllItems() {
  try {
    // Attempt to fetch data from server
    const dbname = await get_session_cookie();
    const url = `${base_url}/api/get-items?dbname=${dbname[0]}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch items from server');
    }

    const items = await response.json();
    return items;
  } catch (error) {
    console.error('Error fetching items from server:', error);



  }
}


// Search operation by name or barcode
async function searchItems(query) {
  try {
    const dbname = await get_session_cookie();

    // Attempt to search items on server by name
    // const responseByName = await fetch(`${base_url}/api/items/search?name=${query}&dbname=${dbname[0]}`);
    // const itemsByName = await responseByName.json();

    //Attempt to search items on server by barcode
    const responseByBarcode = await fetch(`${base_url}/api/items/search/barcode?barcode=${query}&dbname=${dbname[0]}`);
    const itemsByBarcode = await responseByBarcode.json();

    // Merge the results from both searches
    const mergedItems = itemsByBarcode;

    return mergedItems;

  } catch (error) {
    console.error('Error searching items on server:', error);
    return error;
  }
}

// Function to create the splash window
function createWindow(width, height, maxHeight, maxWidth, theme = light) {

  data = { "theme": theme }

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    minHeight: 300,
    minWidth: 300,
    frame: false,

    center: true,
    resizable: false,

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      devTools: false,
      preload: path.join(__dirname, "preload.js"), // Provide the absolute path here
    },
  });

  mainWindow.loadFile("./core/splashscreen.html", { query: { "data": JSON.stringify(data) } });


}


// open a new window and close old one
function openNewWindow(width, height, pageName, resizable, theme) {
  if (mainWindow) {
    mainWindow.close();
  }

  createWindowWithSize(width, height, pageName, resizable, theme);
}

function createWindowWithSize(width, height, pageName, resizable, theme) {
  app.name = "SellSwift";
  data = { "theme": theme }

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    minHeight: 500,
    minWidth: 500,
    center: true,
    resizable: resizable,
    frame: false,

   
    webPreferences: {
      
      nodeIntegration: true,
      contextIsolation:true,
      preload: path.join(__dirname, "preload.js"), // Provide the absolute path here
    },
  });

  mainWindow.loadFile(`./core/${pageName}`, { query: { "data": JSON.stringify(data) } });
}

// Listen for IPC message to set cookie
ipcMain.on("set-cookie", (event, cookieInfo) => {
  const { name, value, organization, days } = cookieInfo;

  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

  const expires = date.toUTCString();

  const Userid = {
    url: "http://localhost",
    name: name,
    value: value,
    expirationDate: Math.floor(date.getTime() / 1000), // Convert to seconds
  };

  session.defaultSession.cookies.set(Userid, (error) => {
    if (error) console.error(error);
  });

  const setOrg = {
    url: "http://localhost",
    name: "organization",
    value: organization,
    expirationDate: Math.floor(date.getTime() / 1000), // Convert to seconds
  };

  session.defaultSession.cookies.set(setOrg, (error) => {
    if (error) console.error(error);
  });
});


async function goToMain() {
  await sleep(100);
  const theme = await return_theme()
  openNewWindow(1200, 900, "index.html", true, theme);
}

// allow user to proceed tp main
ipcMain.on("proceedMain", async (event, args) => {

  await goToMain()

})


ipcMain.on("logout", async (event, args) => {

  delete_cookies()

  const theme = await return_theme()

  openNewWindow(500, 800, "pages-login.html", false, theme)
})


async function base64_encode(file) {
  // Read binary data
  const bitmap = await fs.readFile(file);
  // Convert binary data to base64 encoded string
  return Buffer.from(bitmap).toString('base64');
}

// Define IPC main process function to handle data insertion
ipcMain.handle('insertItem', async (event, item) => {
  try {


    if (item.image === "./images/brand-identity.png") {
      var productImagePath = path.join(__dirname, 'core', 'assets', 'images', 'brand-identity.png');
    }
    else {

      var productImagePath = item.image;

    }


    const base64_img = await base64_encode(productImagePath)

    // Replace image property in item with Blob
    const itemWithBlob = { ...item, image: base64_img };


    // Call the function responsible for inserting data
    const result = await insertItem(itemWithBlob);

    console.log(result)

    return result;


  } catch (error) {
    return { error: error.message };
  }
});



ipcMain.handle('Inventorydelete', async (event, inventoryid) => {
  try {

    const user_cookies = await get_session_cookie();

    const response = await fetch(`${base_url}/delete-inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inventory_id: inventoryid,
        dbname: user_cookies[0]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to delete items from server');
    }

    const items = await response.json();
    return items;
  } catch (error) {
    return { error: error.message };
  }

});

ipcMain.handle('SearchInventory', async (event, search_query) => {

  const search_results = await searchItems(search_query)

  //console.log(search_results)

  return search_results

})

ipcMain.handle("getuser", async (event, args) => {
  try {
    const dbname = await get_session_cookie();

	if(dbname[0] && dbname[1]){


		const response = await axios.post(`${base_url}/api/get-logged-user`, {
			dbname: dbname[0],
			sessioncookie: dbname[1]
		  });
		  response["base_url"] = base_url;
	  
		  console.log(response)
	  
		  return response;

	}else{
		var response ={base_url:base_url}
		console.log(response)
		return response
	}
   

  } catch (error) {
    console.error('Error getting logged-in user:', error.message);
    return { error: error.message };
  }
});

ipcMain.handle("returnBase64file", async (event, filepath) => {

  const base64_img = await base64_encode(filepath)

  return base64_img;

})

ipcMain.handle('start-scanning', async () => {
  console.log("scanner called")
 return "scanned code"
});


ipcMain.on('minimize', () => {
  mainWindow.minimize();

    
});

ipcMain.on('maximize', () => {
  if (mainWindow.isMaximized() || mainWindow.isFullScreen()) {
    mainWindow.setFullScreen(false);
   
    mainWindow.restore();

    
  } else {
    mainWindow.maximize();

    mainWindow.setFullScreen(true);
   
  }
});

ipcMain.on('close', () => {
  mainWindow.close();
});

ipcMain.handle("SetTheme", async (event, theme) => {
  const date = new Date();
  date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);

  const theme_conf = {
    url: "http://local",
    name: "theme_conf",
    value: theme,
    expirationDate: Math.floor(date.getTime() / 1000), // Convert to seconds
  };

  session.defaultSession.cookies.set(theme_conf, (error) => {
    if (error) console.error(error);
  });


});


ipcMain.handle("getTheme", async (event) => {


  try {
    // Retrieve the cookie
    const cookies = await session.defaultSession.cookies.get({ url: "http://local", name: "theme_conf" });

    if (cookies.length > 0) {
      // If the cookie exists, return its value
      return cookies[0].value;
    } else {
      // If the cookie does not exist, return a default value or handle the case accordingly
      return "defaultTheme";
    }
  } catch (error) {
    console.error(error);
    // Handle the error appropriately
    return null; // Return null or handle the error accordingly
  }
});


// Listen for the 'retrieve-cookie and determine logged in user' IPC message
ipcMain.handle("get/cookie", async (event, cookieName) => {
  try {

    const con_response = await axios.get(`${base_url}/test_connection`, {})
    console.log(con_response)

    const cookies = await session.defaultSession.cookies.get({
      name: cookieName,
    });

    let cookieValue = null;
    let organization = null;

    if (cookies.length > 0) {
      cookieValue = cookies[0].value;
      if (cookies.length > 1) {
        organization = cookies[1].value;
      }
    }

    else {
      await sleep(1000);
      const theme = await return_theme()
      openNewWindow(500, 800, "pages-login.html", false, theme)

      return "user cookies not found login or signup"
    }

    // Send a POST request to the server
    const response = await axios.post(`${base_url}/verifyUser`, {
      cookie: cookieValue,
      organization: organization,
    });


    // Return the server response if we hit this code user is logged in
    await goToMain();

    return response.data.message;
  } catch (error) {

    // Assuming 'error' is the provided error object


    if (error && error.code === "ECONNREFUSED") {
      console.log("Network error: Connection refused");
      return { msg: "Network error: Connection refused, Error code 500", error_code: 500 };

    } else if (error && error.code === "ENETUNREACH") {

      return { msg: "Network error: you're not connected to the internet, Error code 503", error_code: 503 }; // Send null in case of an error
    }
    else {
      return null;
    }

  }
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


function delete_cookies() {

  session.defaultSession.clearStorageData({ options: { origin: 'http://localhost', storages: ['cookies'] } }, function (data) {
    //resolve();
  });



}

//Configure auto-updater
function configureAutoUpdater() {
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'https://your-server-url.com/updates'
  });

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
  });

  autoUpdater.on('update-not-available', () => {
    console.log('No update available');
  });

  autoUpdater.on('error', (err) => {
    console.error('Update error:', err.message);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded');
    autoUpdater.quitAndInstall();
  });

  // Check for updates
  autoUpdater.checkForUpdates();

}

ipcMain.on('request-initial-data', async (event) => {
  const initialData = await getAllItems();


  event.sender.send('initial-data', initialData);
});

ipcMain.handle("get-inventory",async (event,args)=>{

  const initialData = await getAllItems();

  return initialData;
})


const return_theme = async () => {
  try {
    // Retrieve the cookie
    const cookies = await session.defaultSession.cookies.get({ url: "http://local", name: "theme_conf" });

    if (cookies.length > 0) {
      // If the cookie exists, return its value
      return cookies[0].value;
    } else {
      // If the cookie does not exist, return a default value or handle the case accordingly
      return "defaultTheme";
    }
  } catch (error) {
    console.error(error);
    // Handle the error appropriately
    return null; // Return null or handle the error accordingly
  }
}

// Event listener for app ready
app.on("ready", async () => {
  // Initial window dimensions
  const initialWidth = 300;
  const initialHeight = 200;

  // Interval to send data at regular intervals
  setInterval(async () => {
    const inventory_items = await getAllItems();
    mainWindow.webContents.send('new-data', inventory_items);
  }, 600000); // Send data every 10 minutes


  //delete_cookies()

  const theme = await return_theme()


  createWindow(initialWidth, initialHeight, initialHeight, initialWidth, theme);


});

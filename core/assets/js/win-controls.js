$(document).ready(async function () { // Self-invoking async function structure corrected

    const minimizeButton = $('#minimize-button');
    const maximizeButton = $('#maximize-button');
    const closeButton = $('#close-button');

    // Fetch user information via IPC renderer
    const get_user = async () => {
        try {
            const user_info = await ipcRenderer.GetUser();
            return user_info;
        } catch (error) {
            console.error("Error getting user information:", error.message);
            return null; // In case of error, return null to handle failures later
        }
    };

    // Get user information
    const users_information = await get_user();

    // Ensure the user information is fetched successfully
    if (!users_information) {
        console.error("Failed to fetch user information");
        return;
    }

    let base_url = users_information.base_url;

    // Logout function
    const logout = async () => {
        try {
            const response = await fetch(`${base_url}/api/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: users_information._id, // Use correct variable
                    db_name: users_information.organization,
                }),
            });

            if (response.ok) {
                console.log("Log out successful");
            } else {
                console.error('Failed to logout:', response.statusText);
            }
        } catch (error) {
            console.error('Error logging out:', error.message);
        }
    };

    // Minimize window
    minimizeButton.on('click', () => {
        ipcRenderer.send('minimize');
    });

    // Maximize/restore window
    maximizeButton.on('click', () => {
        let maximizeButton = $('#maximize-button');
        let iconClass = maximizeButton.hasClass('ri-checkbox-multiple-blank-line') ? 'ri-checkbox-blank-line' : 'ri-checkbox-multiple-blank-line';
        maximizeButton.removeClass().addClass(iconClass);
        $('#maximize-button-container').attr('title', iconClass === 'ri-checkbox-multiple-blank-line' ? 'Maximize/Restore' : 'Maximize');
        ipcRenderer.send('maximize');
    });

    // Close window and log out
    closeButton.on('click', async () => {
        await logout(); // Log out before closing the window
        ipcRenderer.send('close');
    });

    // Light/Dark mode toggle
    $("#light-dark-mode").on("click", async function () {
        let theme = $('html').attr('data-bs-theme');
        await ipcRenderer.invoke('SetTheme', theme); // Ensure to invoke the correct IPC renderer method
    });
});



$(document).ready(() => {

    const minimizeButton = $('#minimize-button');
    const maximizeButton = $('#maximize-button');
    const closeButton = $('#close-button');

    let base_url=user_info.base_url

    const logout=async ()=>{
        try {
            const response = await fetch(`${base_url}/api/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id: user_info._id,db_name:user_info.organization }) // Assuming userId is available
            });
    
            if (response.ok) {

                console.log("log out successful")

            
            } else {
                console.error('Failed to logout:', response.statusText);
                
            }
        } catch (error) {
            console.error('Error logging out:', error.message);
            
        }
    }

    minimizeButton.on('click', () => {
        ipcRenderer.send('minimize');
    });



    maximizeButton.on('click', () => {
        var maximizeButton = $('#maximize-button');
        var iconClass = maximizeButton.hasClass('ri-checkbox-multiple-blank-line') ? 'ri-checkbox-blank-line' : 'ri-checkbox-multiple-blank-line';
        maximizeButton.removeClass().addClass(iconClass);
        $('#maximize-button-container').attr('title', iconClass === 'ri-checkbox-multiple-blank-line' ? 'Maximize/Restore' : 'Maximize');
        
        ipcRenderer.send('maximize');
    });

    closeButton.on('click', async () => {
        await logout();

        ipcRenderer.send('close');

    });

    $("#light-dark-mode").on("click",async function(){
       
        var theme = $('html').attr('data-bs-theme');

        await ipcRenderer.SetTheme(theme)


    })



});

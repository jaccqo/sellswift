

$(document).ready(() => {
    const minimizeButton = $('#minimize-button');
    const maximizeButton = $('#maximize-button');
    const closeButton = $('#close-button');

    minimizeButton.on('click', () => {
        ipcRenderer.send('minimize');
    });

    maximizeButton.on('click', () => {
        ipcRenderer.send('maximize');
    });

    closeButton.on('click', () => {
        ipcRenderer.send('close');
    });

    $("#light-dark-mode").on("click",async function(){
       
        var theme = $('html').attr('data-bs-theme');

        await ipcRenderer.SetTheme(theme)


    })


});

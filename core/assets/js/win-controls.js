

$(document).ready(() => {
    const minimizeButton = $('#minimize-button');
    const maximizeButton = $('#maximize-button');
    const closeButton = $('#close-button');

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

    closeButton.on('click', () => {
        ipcRenderer.send('close');
    });

    $("#light-dark-mode").on("click",async function(){
       
        var theme = $('html').attr('data-bs-theme');

        await ipcRenderer.SetTheme(theme)


    })



});

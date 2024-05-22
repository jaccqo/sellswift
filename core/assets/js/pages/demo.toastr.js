function showToast(heading, text, position, loaderBg, icon, hideAfter = 3000, stack = 1, showHideTransition = "fade") {
    const options = {
        heading: heading,
        text: text,
        position: position,
        loaderBg: loaderBg,
        icon: icon,
        hideAfter: hideAfter,
        stack: stack,
        showHideTransition: showHideTransition
    };
    $.toast().reset("all");
    $.toast(options);
}

$("#toastr-one").on("click", function () {
    showToast(
        "Heads up!",
        "This alert needs your attention, but it is not super important.",
        "top-right",
        "rgba(0,0,0,0.2)",
        "info"
    );
});

$("#toastr-two").on("click", function () {
    showToast(
        "Heads up!",
        "Check below fields please.",
        "top-center",
        "rgba(0,0,0,0.2)",
        "warning"
    );
});

$("#toastr-three").on("click", function () {
    showToast(
        "Well Done!",
        "You successfully read this important alert message",
        "bottom-right",
        "rgba(0,0,0,0.2)",
        "success"
    );
});

$("#toastr-four").on("click", function () {
    
    
});

$("#toastr-five").on("click", function () {
    showToast(
        "How to contribute?",
        [
            "Fork the repository",
            "Improve/extend the functionality",
            "Create a pull request",
        ],
        "top-right",
        "rgba(0,0,0,0.2)",
        "info"
    );
});

$("#toastr-six").on("click", function () {
    showToast(
        "Can I add <em>icons</em>?",
        "Yes! check this <a href='https://github.com/kamranahmedse/jquery-toast-plugin/commits/master'>update</a>.",
        "top-right",
        "rgba(0,0,0,0.2)",
        "info",
        false
    );
});

$("#toastr-seven").on("click", function () {
    showToast(
        "",
        "Set the `hideAfter` property to false and the toast will become sticky.",
        "top-right",
        "rgba(0,0,0,0.2)",
        "success"
    );
});

$("#toastr-eight").on("click", function () {
    showToast(
        "",
        "Set the `showHideTransition` property to fade|plain|slide to achieve different transitions.",
        "top-right",
        "rgba(0,0,0,0.2)",
        "info",
        3000,
        1,
        "fade"
    );
});

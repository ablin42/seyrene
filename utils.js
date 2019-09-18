module.exports = function () {
    this.formatAlert = function (type, message, style = "") {
        return `<div id="alert" class="alert alert-${type}" style="${style}" role="alert">${message}
            <button type="button" class="close" onclick="dismissAlert(this)" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            </div>`;
    }
}
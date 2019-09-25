let Validate = {
    Username: function(username) {
        let inputId = username.id,
            spanInfo = document.getElementById(`i_${inputId}`);
            
        if (username.value.length !== 0 && (username.value.length < 4 || username.value.length > 30)) {
            spanInfo.style.display = "inline-block";
            username.classList.add("invalid");
        }
        else if (username.value.length >= 4 || username.value.length <= 30) {
            spanInfo.style.display = "none";
            username.classList.remove("invalid");
            username.classList.add("valid");
        }
        else {
            spanInfo.style.display = "none";
            username.classList.remove("invalid");
            username.classList.remove("valid");
        }
    },
    Email: function(email) {
        let inputId = email.id
            spanInfo = document.getElementById(`i_${inputId}`);

        if (email.value.length !== 0 && (email.value.length < 3 || email.value.length > 255)){
            spanInfo.style.display = "inline-block";
            email.classList.add("invalid");
        }
        else if (email.value.length !== 0) {
            if (/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email.value))
            {
                spanInfo.style.display = "none";
                email.classList.remove("invalid");
                email.classList.add("valid");
            }
        }
        else {
            spanInfo.style.display = "none";
            email.classList.remove("invalid");
            email.classList.remove("valid");
        }
    },
    Password: function(password) {
        let inputId = password.id,
            spanInfo = document.getElementById(`i_${inputId}`),
            password2 = document.getElementById(`${inputId}2`);

        if (password.value.length > 0 && (password.value.length > 30 || !/^(((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(.{8,})/.test(password.value))) {
            spanInfo.style.display = "inline-block";
            password.classList.add("invalid");
        }
        else if (password.value.length !== 0) {
            spanInfo.style.display = "none";
            password.classList.remove("invalid");
            password.classList.add("valid");
        }
        else {
            spanInfo.style.display = "none";
            password.classList.remove("invalid");
            password.classList.remove("valid");
        }
        this.Password2(password2);
    },
    Password2: function(password2) {
        let inputId = password2.id,
            spanInfo = document.getElementById(`i_${inputId}`);

        if (password2.value.length !== 0 && (password.value !== password2.value)) {
            spanInfo.style.display = "inline-block";
            password2.classList.add("invalid");
        }
        else if (password2.value.length !== 0) {
            spanInfo.style.display = "none";
            password2.classList.remove("invalid");
            password2.classList.add("valid");
        }
        else {
            spanInfo.style.display = "none";
            password2.classList.remove("invalid");
            password2.classList.remove("valid");
        }
    }
}
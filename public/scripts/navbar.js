const hamburger = document.querySelector('.hamburger');
const links = document.querySelectorAll('.nav-links li');
const navContainer = document.querySelector('.navbar-container');
const logo = document.querySelector('.logo');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('toggle');
    navContainer.classList.toggle('open');
    links.forEach(link => {
        link.classList.toggle("fading");
    });
    logo.classList.toggle("fading");
});
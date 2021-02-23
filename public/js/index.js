/* eslint-disable*/
import '@babel/polyfill';
import { bookTour } from './stripe';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { signup } from './signup';
import { updateUsersettings } from './updateSettings';

// DOM elements
const mapBox = document.getElementById('map');

const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const bookTourBtn = document.getElementById('book-tour');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userSettingsForm = document.querySelector('.form-user-settings');

// values

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;

    signup(name, email, password, passwordConfirm);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}
if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateUsersettings(form, 'data');
  });
}

if (userSettingsForm) {
  userSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.password-update-btn').textContent = 'updating...';
    const currentPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const newPasswordConfirm = document.getElementById('password-confirm')
      .value;

    await updateUsersettings(
      { currentPassword, newPassword, newPasswordConfirm },
      'password'
    );
    document.querySelector('.password-update-btn').textContent =
      'save password';

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}
if (bookTourBtn) {
  bookTourBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    bookTourBtn.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    await bookTour(tourId);
  });
}

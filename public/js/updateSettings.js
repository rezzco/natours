import axios from 'axios';
import { showAlert } from './alert';
import { Capitalize } from './utils';

// type is the kind of setting we are updating pass or email and name and pic
export const updateUsersettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updatePassword'
        : '/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url,
      data
    });
    if (res.data.status === 'success') {
      showAlert('success', ` your ${Capitalize(type)} updated successfully!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
    console.log(err.response);
  }
};

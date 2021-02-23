/* eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51INQEWAXlhFY9gsvzLg4vqvlFHrMApHL2g424yuIHP0ZWiyNux85vcjLvotVnDZraa7zmi3In7rN3gDyoyRREFsj00cwv7SJuT'
  );

  try {
    const session = await axios({
      method: 'GET',
      url: `/api/v1/bookings//checkout-session/${tourId}`
    });
    // check out and charge the user
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};

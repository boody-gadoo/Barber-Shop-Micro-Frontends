/**
 * Booking page that wraps the Booking remote MFE
 * Loads the Angular-based booking micro frontend
 */
import { RemoteWrapper } from '../components/RemoteWrapper';

export function BookingPage(): JSX.Element {
  return (
    <div className="booking-page-wrapper">
      <RemoteWrapper remote="booking" module="./Container" />
    </div>
  );
}

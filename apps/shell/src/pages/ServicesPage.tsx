/**
 * Services page that wraps the Services remote MFE
 */
import { RemoteWrapper } from '../components/RemoteWrapper';

export function ServicesPage(): JSX.Element {
  return (
    <div className="services-page-wrapper">
      <RemoteWrapper remote="services" module="./Container" />
    </div>
  );
}

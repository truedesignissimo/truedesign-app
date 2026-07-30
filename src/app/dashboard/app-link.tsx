import AppIcon from "../_components/app-icon";
import { getAppDisplayName } from "../_components/app-icon-model";

export default function AppLink({
  name,
  url,
}: {
  name: string;
  url: string | null;
}) {
  if (!url) {
    return (
      <div className="app-title-card app-title-card-disabled" aria-disabled="true">
        <span className="app-card-content">
          <h2>{getAppDisplayName(name, url)}</h2>
        </span>
      </div>
    );
  }

  return (
    <a className="app-title-card" href={url}>
      <span className="app-card-content">
        <AppIcon className="app-card-icon" url={url} />
        <h2>{getAppDisplayName(name, url)}</h2>
      </span>
    </a>
  );
}

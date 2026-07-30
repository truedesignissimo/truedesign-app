import AppIcon from "./app-icon";
import { getAppDisplayName } from "./app-icon-model";

export default function HomeAppLink({ name, url }: { name: string; url: string }) {
  return (
    <a className="home-workspace-app" href={url}>
      <span className="app-card-content">
        <AppIcon className="app-card-icon" url={url} />
        <strong>{getAppDisplayName(name, url)}</strong>
      </span>
    </a>
  );
}

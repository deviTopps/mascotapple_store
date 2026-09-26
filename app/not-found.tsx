import ErrorScreen from "./error-screen";

export default function NotFound() {
  return <ErrorScreen kind="missing" title="This page couldn’t be found." message="The link may have changed or the page may no longer be available. Explore the shop to find what you need." />;
}

import ErrorScreen from "../../error-screen";

export default function ProductNotFound() {
  return <ErrorScreen kind="missing" title="Product not found." message="This product may no longer be available, or its link may have changed. Browse our current collection or contact us for help." />;
}

import { StrictMode } from "react";
import { Provider } from "tinybase/debug/ui-react";
import { StoreInspector } from "tinybase/debug/ui-react-dom";
import { store } from "../services/db";

export const App = () => {
  return (
    <StrictMode>
      <Provider store={store}>
        <StoreInspector />
      </Provider>
    </StrictMode>
  );
};

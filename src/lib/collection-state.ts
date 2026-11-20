export type CollectionState<T> = { data: T[]; loading: boolean; error: string };
export type CollectionEvent<T> =
  | { type: "start" }
  | { type: "success"; data: T[] }
  | { type: "failure"; error: string }
  | { type: "update"; update: (data: T[]) => T[] }
  | { type: "reset" };

export const initialCollection = <T>(): CollectionState<T> => ({ data: [], loading: true, error: "" });

export function collectionReducer<T>(state: CollectionState<T>, event: CollectionEvent<T>): CollectionState<T> {
  switch (event.type) {
    case "start": return { ...state, loading: true, error: "" };
    case "success": return { data: event.data, loading: false, error: "" };
    case "failure": return { ...state, loading: false, error: event.error };
    case "update": return { ...state, data: event.update(state.data) };
    case "reset": return initialCollection<T>();
  }
}

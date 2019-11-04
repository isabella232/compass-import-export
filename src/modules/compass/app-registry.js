const PREFIX = 'import-export/app-registry';
export const ACTIVATED = `${PREFIX}/ACTIVATED`;
export const EMIT = `${PREFIX}/EMIT`;

const INITIAL_STATE = null;

export const appRegistryActivated = (appRegistry) => ({
  type: ACTIVATED,
  appRegistry: appRegistry
});

export const appRegistryEmit = (name, ...args) => ({
  type: EMIT,
  name: name,
  args: args
});

const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === ACTIVATED) {
    return action.appRegistry;
  }

  if (action.type === EMIT) {
    const appRegistry = state._emitter;
    // TODO: Irina, figure out under what `globalAppRegistry` is stored
    if (appRegistry) {
      appRegistry.emit(action.name, ...action.args);
    }
    if (globalAppRegistry) {
      globalAppRegistry.emit(action.name, ...action.args);
    }
    return state;
  }
  return state;
};

export default reducer;

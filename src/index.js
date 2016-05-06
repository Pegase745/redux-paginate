import merge from 'lodash/object/merge';
import union from 'lodash/array/union';

// Creates a reducer managing pagination, given the action types to handle,
// and a function telling how to extract the key from an action.
export default function paginate({ types, mapActionToKey }) {
  if (!Array.isArray(types) || types.length < 3) {
    throw new Error('Expected types to be an array of more than two elements.');
  }
  if (!types.every(t => typeof t === 'string')) {
    throw new Error('Expected types to be strings.');
  }
  if (mapActionToKey && typeof mapActionToKey !== 'function') {
    throw new Error('Expected mapActionToKey to be a function.');
  }

  const [requestType, successType, failureType, createType] = types;

  function updatePagination(state = {}, action) {
    if (typeof state.pageCount !== 'number') {
      state = {
        isFetching: false,
        nextPageUrl: undefined,
        pageCount: 0,
        ids: [],
      }
    }
    const result = action.payload && action.payload.result;
    switch (action.type) {
    case requestType:
      return merge({}, state, {
        isFetching: true,
      });
    case successType:
      return merge({}, state, {
        isFetching: false,
        ids: union(state.ids, result),
        nextPageUrl: action.payload.nextPageUrl,
        pageCount: state.pageCount + 1,
      });
    case failureType:
      return merge({}, state, {
        isFetching: false,
      });
    case createType:
      return merge({}, state, {
        ids: union([result], state.ids),
      });
    default:
      return state;
    }
  }

  return function updatePaginationByKey(state = {}, action) {
    switch (action.type) {
    case requestType:
    case successType:
    case failureType:
    case createType:
      if (mapActionToKey) {
        const key = mapActionToKey(action);
        if (typeof key !== 'string') {
          throw new Error('Expected key to be a string.');
        }
        return merge({}, state, {
          [key]: updatePagination(state[key], action),
        });
      }
      return merge({}, state, updatePagination(state, action));
    default:
      return state;
    }
  };
}

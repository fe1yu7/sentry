import {Thread} from 'app/types/events';
import {Event} from 'app/types';

import getThreadException from './get-thread-exception';

// TODO(ts): define raw type
function getThreadStacktrace(thread: Thread, event: Event, raw?: any) {
  const exc = getThreadException(thread, event);
  if (exc) {
    let rv = null;
    for (const singleExc of exc.values) {
      if (singleExc.threadId === thread.id) {
        rv = (raw && singleExc.rawStacktrace) || singleExc.stacktrace;
      }
    }
    return rv;
  }

  if (raw && thread.rawStacktrace) {
    return thread.rawStacktrace;
  }

  if (thread.stacktrace) {
    return thread.stacktrace;
  }

  return null;
}

export default getThreadStacktrace;

/* eslint-disable valid-jsdoc */
import { promisify } from 'util';
import fs from 'fs';
const checkFileExists = promisify(fs.exists);
const getFileStats = promisify(fs.stat);

import stream from 'stream';
import stripBomStream from 'strip-bom-stream';
import mime from 'mime-types';

import PROCESS_STATUS from 'constants/process-status';
import STEP from 'constants/import-step';
import { appRegistryEmit } from 'modules/compass';

import detectImportFile from 'utils/detect-import-file';
import { createCollectionWriteStream } from 'utils/collection-stream';
import createParser, { createProgressStream } from 'utils/parsers';
import createPreviewWritable, { createPeekStream } from 'utils/import-preview';

import createImportSizeGuesstimator from 'utils/import-size-guesstimator';
import { removeBlanksStream } from 'utils/remove-blanks';
import { transformProjectedTypesStream } from 'utils/apply-import-types-and-projection';

import { createLogger } from 'utils/logger';

const debug = createLogger('import');

/**
 * ## Action names
 */
const PREFIX = 'import-export/import';
const STARTED = `${PREFIX}/STARTED`;
const CANCELED = `${PREFIX}/CANCELED`;
const PROGRESS = `${PREFIX}/PROGRESS`;
const FINISHED = `${PREFIX}/FINISHED`;
const FAILED = `${PREFIX}/FAILED`;
const FILE_TYPE_SELECTED = `${PREFIX}/FILE_TYPE_SELECTED`;
const FILE_SELECTED = `${PREFIX}/FILE_SELECTED`;
const OPEN = `${PREFIX}/OPEN`;
const CLOSE = `${PREFIX}/CLOSE`;
const SET_PREVIEW = `${PREFIX}/SET_PREVIEW`;
const SET_DELIMITER = `${PREFIX}/SET_DELIMITER`;
const SET_GUESSTIMATED_TOTAL = `${PREFIX}/SET_GUESSTIMATED_TOTAL`;
const SET_STOP_ON_ERRORS = `${PREFIX}/SET_STOP_ON_ERRORS`;
const SET_IGNORE_BLANKS = `${PREFIX}/SET_IGNORE_BLANKS`;
const TOGGLE_INCLUDE_FIELD = `${PREFIX}/TOGGLE_INCLUDE_FIELD`;
const SET_FIELD_TYPE = `${PREFIX}/SET_FIELD_TYPE`;
const SET_STEP = `${PREFIX}/SET_STEP`;

/**
 * Initial state.
 * @api private
 */
export const INITIAL_STATE = {
  isOpen: false,
  step: STEP.OPTIONS,
  progress: 0,
  error: null,
  fileName: '',
  fileIsMultilineJSON: false,
  useHeaderLines: true,
  status: PROCESS_STATUS.UNSPECIFIED,
  fileStats: null,
  docsWritten: 0,
  guesstimatedDocsTotal: 0,
  delimiter: ',',
  stopOnErrors: false,
  ignoreBlanks: true,
  fields: [],
  values: [],
  previewLoaded: false
};

/**
 * @param {Number} progress
 * @param {Number} docsWritten
 * @api private
 */
export const onProgress = (progress, docsWritten) => ({
  type: PROGRESS,
  progress: Math.min(progress, 100),
  error: null,
  docsWritten: docsWritten
});

/**
 * @param {stream.Readable} source
 * @param {stream.Readable} dest
 * @api private
 */
export const onStarted = (source, dest) => ({
  type: STARTED,
  source: source,
  dest: dest
});

/**
 * @param {Number} docsWritten
 * @api private
 */
export const onFinished = (docsWritten) => ({
  type: FINISHED,
  docsWritten: docsWritten
});

/**
 * @param {Error} error
 * @api private
 */
export const onError = (error) => ({
  type: FAILED,
  error: error
});

/**
 *
 * @param {Number} guesstimatedDocsTotal
 * @api private
 */
export const onGuesstimatedDocsTotal = (guesstimatedDocsTotal) => ({
  type: SET_GUESSTIMATED_TOTAL,
  guesstimatedDocsTotal: guesstimatedDocsTotal
});

/**
 * The import module reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The state.
 */
// eslint-disable-next-line complexity
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === SET_GUESSTIMATED_TOTAL) {
    return {
      ...state,
      guesstimatedDocsTotal: action.guesstimatedDocsTotal
    };
  }

  if (action.type === SET_DELIMITER) {
    return {
      ...state,
      delimiter: action.delimiter
    };
  }

  if (action.type === SET_STEP) {
    return {
      ...state,
      step: action.step
    };
  }

  if (action.type === TOGGLE_INCLUDE_FIELD) {
    const newState = {
      ...state
    };
    newState.fields = newState.fields.map((field) => {
      if (field.path === action.path) {
        field.checked = !field.checked;
      }
      return field;
    });
    return newState;
  }

  if (action.type === SET_FIELD_TYPE) {
    const newState = {
      ...state
    };
    newState.fields = newState.fields.map((field) => {
      if (field.path === action.path) {
        field.checked = true;
        field.type = action.bsonType;
      }
      return field;
    });
    return newState;
  }

  if (action.type === SET_PREVIEW) {
    return {
      ...state,
      values: action.values,
      fields: action.fields,
      previewLoaded: true
    };
  }

  if (action.type === SET_STOP_ON_ERRORS) {
    return {
      ...state,
      stopOnErrors: action.stopOnErrors
    };
  }

  if (action.type === SET_IGNORE_BLANKS) {
    return {
      ...state,
      ignoreBlanks: action.ignoreBlanks
    };
  }

  if (action.type === FILE_SELECTED) {
    return {
      ...state,
      fileName: action.fileName,
      fileType: action.fileType,
      fileStats: action.fileStats,
      fileIsMultilineJSON: action.fileIsMultilineJSON,
      status: PROCESS_STATUS.UNSPECIFIED,
      progress: 0,
      docsWritten: 0,
      source: undefined,
      dest: undefined
    };
  }

  if (action.type === FAILED) {
    return {
      ...state,
      error: action.error,
      status: PROCESS_STATUS.FAILED
    };
  }

  if (action.type === STARTED) {
    return {
      ...state,
      error: null,
      progress: 0,
      status: PROCESS_STATUS.STARTED,
      source: action.source,
      dest: action.dest
    };
  }

  if (action.type === PROGRESS) {
    return {
      ...state,
      progress: action.progress,
      docsWritten: action.docsWritten
    };
  }

  if (action.type === FINISHED) {
    const isComplete = !(
      state.error || state.status === PROCESS_STATUS.CANCELED
    );
    return {
      ...state,
      status: isComplete ? PROCESS_STATUS.COMPLETED : state.status,
      docsWritten: action.docsWritten,
      source: undefined,
      dest: undefined
    };
  }

  if (action.type === CANCELED) {
    return {
      ...state,
      status: PROCESS_STATUS.CANCELED,
      source: undefined,
      dest: undefined
    };
  }

  /**
   * Open the `<ImportModal />`
   */
  if (action.type === OPEN) {
    return {
      ...INITIAL_STATE,
      isOpen: true
    };
  }

  if (action.type === CLOSE) {
    return {
      ...state,
      isOpen: false
    };
  }

  if (action.type === FILE_TYPE_SELECTED) {
    return {
      ...state,
      fileType: action.fileType
    };
  }
  return state;
};

/**
 * @api public
 */
export const startImport = () => {
  return (dispatch, getState) => {
    const state = getState();
    const {
      ns,
      dataService: { dataService },
      importData
    } = state;
    const {
      fileName,
      fileType,
      fileIsMultilineJSON,
      fileStats: { size },
      delimiter,
      ignoreBlanks,
      stopOnErrors,
      fields
    } = importData;

    const source = fs.createReadStream(fileName, 'utf8');

    // TODO: lucas: Support ignoreUndefined as an option to pass to driver?
    const dest = createCollectionWriteStream(dataService, ns, stopOnErrors);

    const progress = createProgressStream(size, function(err, info) {
      if (err) return;
      dispatch(onProgress(info.percentage, dest.docsWritten));
    });

    const importSizeGuesstimator = createImportSizeGuesstimator(
      source,
      size,
      function(err, guesstimatedTotalDocs) {
        if (err) return;

        progress.setLength(guesstimatedTotalDocs);
        dispatch(onGuesstimatedDocsTotal(guesstimatedTotalDocs));
      }
    );

    const stripBOM = stripBomStream();

    const removeBlanks = removeBlanksStream(ignoreBlanks);

    const applyTypes = transformProjectedTypesStream(fields);

    const parser = createParser({
      fileName,
      fileType,
      delimiter,
      fileIsMultilineJSON
    });

    debug('executing pipeline');

    dispatch(onStarted(source, dest));
    stream.pipeline(
      source,
      stripBOM,
      parser,
      removeBlanks,
      applyTypes,
      importSizeGuesstimator,
      progress,
      dest,
      function(err, res) {
        /**
         * refresh data (docs, aggregations) regardless of whether we have a
         * partial import or full import
         */
        dispatch(appRegistryEmit('refresh-data'));
        /**
         * TODO: lucas: Decorate with a codeframe if not already
         * json parsing errors already are.
         */
        if (err) {
          return dispatch(onError(err));
        }
        /**
         * TODO: lucas: once import is finished,
         * trigger a refresh on the documents view.
         */
        debug('done', err, res);
        dispatch(onFinished(dest.docsWritten));
        dispatch(appRegistryEmit('import-finished', size, fileType));
      }
    );
  };
};

/**
 * Cancels an active import if there is one, noop if not.
 *
 * @api public
 */
export const cancelImport = () => {
  return (dispatch, getState) => {
    const { importData } = getState();
    const { source, dest } = importData;

    if (!source || !dest) {
      debug('no active import to cancel.');
      return;
    }
    debug('cancelling');
    source.unpipe();

    debug('import canceled by user');
    dispatch({ type: CANCELED });
  };
};

/**
 * Load a preview of the first few documents in the selected file
 * which is used to calculate an inital set of `fields` and `values`.
 *
 * @param {String} fileName
 * @param {String} fileType
 * @api private
 */
const loadPreviewDocs = (
  fileName,
  fileType,
  delimiter,
  fileIsMultilineJSON
) => {
  return (dispatch, getState) => {
    /**
     * TODO: lucas: add dispatches for preview loading, error, etc.
     */

    const source = fs.createReadStream(fileName, 'utf8');
    const dest = createPreviewWritable();
    stream.pipeline(
      source,
      createPeekStream(fileType, delimiter, fileIsMultilineJSON),
      dest,
      function(err) {
        if (err) {
          throw err;
        }
        dispatch({
          type: SET_PREVIEW,
          fields: dest.fields,
          values: dest.values
        });
      }
    );
  };
};

/**
 * Mark a field to be included or excluded from the import.
 *
 * @param {String} path Dot notation path of the field.
 * @api public
 */
export const toggleIncludeField = (path) => ({
  type: TOGGLE_INCLUDE_FIELD,
  path: path
});

/**
 * Specify the `type` values at `path` should be cast to.
 *
 * @param {String} path Dot notation accessor for value.
 * @param {String} bsonType A bson type identifier.
 * @example
 * ```javascript
 * //  Cast string _id from a csv to a bson.ObjectId
 * setFieldType('_id', 'ObjectId');
 * // Cast `{stats: {flufiness: "100"}}` to
 * // `{stats: {flufiness: 100}}`
 * setFieldType('stats.flufiness', 'Int32');
 * ```
 * @api public
 */
export const setFieldType = (path, bsonType) => ({
  type: SET_FIELD_TYPE,
  path: path,
  bsonType: bsonType
});

/**
 * Gather file metadata quickly when the user specifies `fileName`
 * @param {String} fileName
 * @api public
 * @see utils/detect-import-file.js
 */
export const selectImportFileName = (fileName) => {
  return (dispatch, getState) => {
    let fileStats = {};
    checkFileExists(fileName)
      .then((exists) => {
        if (!exists) {
          throw new Error(`File ${fileName} not found`);
        }
        return getFileStats(fileName);
      })
      .then((stats) => {
        fileStats = {
          ...stats,
          type: mime.lookup(fileName)
        };
        return promisify(detectImportFile)(fileName);
      })
      .then((detected) => {
        // TODO: lucas: make detect-import-file also detect delimiter like papaparse.
        const delimiter = getState().importData.delimiter;

        dispatch({
          type: FILE_SELECTED,
          fileName: fileName,
          fileStats: fileStats,
          fileIsMultilineJSON: detected.fileIsMultilineJSON,
          fileType: detected.fileType
        });
        dispatch(
          loadPreviewDocs(
            fileName,
            detected.fileType,
            delimiter,
            detected.fileIsMultilineJSON
          )
        );
      })
      .catch((err) => dispatch(onError(err)));
  };
};

/**
 * Select the file type of the import.
 *
 * @param {String} fileType
 * @api public
 */
export const selectImportFileType = (fileType) => {
  return (dispatch, getState) => {
    const {
      previewLoaded,
      fileName,
      delimiter,
      fileIsMultilineJSON
    } = getState().importData;
    dispatch({
      type: FILE_TYPE_SELECTED,
      fileType: fileType
    });

    if (previewLoaded) {
      debug('preview needs updated because fileType changed');
      dispatch(
        loadPreviewDocs(fileName, fileType, delimiter, fileIsMultilineJSON)
      );
    }
  };
};

/**
 * Open the import modal.
 * @api public
 */
export const openImport = () => ({
  type: OPEN
});

/**
 * Close the import modal.
 * @api public
 */
export const closeImport = () => ({
  type: CLOSE
});

/**
 * Change pages within the modal.
 * @api public
 */
export const setStep = (step) => ({
  type: SET_STEP,
  step: step
});

/**
 * Set the tabular delimiter.
 * @param {String} delimiter One of `,` for csv, `\t` for csv
 *
 * @api public
 */
export const setDelimiter = (delimiter) => {
  return (dispatch, getState) => {
    const {
      previewLoaded,
      fileName,
      fileType,
      fileIsMultilineJSON
    } = getState().importData;
    dispatch({
      type: SET_DELIMITER,
      delimiter: delimiter
    });

    if (previewLoaded) {
      debug(
        'preview needs updated because delimiter changed',
        fileName,
        fileType,
        delimiter,
        fileIsMultilineJSON
      );
      dispatch(
        loadPreviewDocs(fileName, fileType, delimiter, fileIsMultilineJSON)
      );
    }
  };
};

/**
 * Stop the import if mongo returns an error for a document write
 * such as a duplicate key for a unique index. In practice,
 * the cases for this being false when importing are very minimal.
 * For example, a duplicate unique key on _id is almost always caused
 * by the user attempting to resume from a previous import without
 * removing all documents sucessfully imported.
 *
 * @param {Boolean} stopOnErrors To stop or not to stop
 * @api public
 * @see utils/collection-stream.js
 * @see https://docs.mongodb.com/manual/reference/program/mongoimport/#cmdoption-mongoimport-stoponerror
 */
export const setStopOnErrors = (stopOnErrors) => ({
  type: SET_STOP_ON_ERRORS,
  stopOnErrors: stopOnErrors
});

/**
 * Any `value` that is `''` will not have this field set in the final
 * document written to mongo.
 *
 * @param {Boolean} ignoreBlanks
 * @api public
 * @see https://docs.mongodb.com/manual/reference/program/mongoimport/#cmdoption-mongoimport-ignoreblanks
 * @todo lucas: Standardize as `setIgnoreBlanks`?
 */
export const setIgnoreBlanks = (ignoreBlanks) => ({
  type: SET_IGNORE_BLANKS,
  ignoreBlanks: ignoreBlanks
});

export default reducer;

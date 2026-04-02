import { AlertTriangle } from 'lucide-react';

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, itemName }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-start gap-4">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <div className="mt-0 text-left">
            <h3 className="text-lg leading-6 font-bold text-gray-900">
              Auswertung löschen
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Möchten Sie die Auswertung für <strong className="text-gray-800">"{itemName}"</strong> wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
          <button
            type="button"
            className="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 w-full sm:w-auto"
            onClick={onConfirm}
          >
            Endgültig löschen
          </button>
          <button
            type="button"
            className="btn btn-secondary mt-3 w-full sm:mt-0 sm:w-auto"
            onClick={onClose}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;

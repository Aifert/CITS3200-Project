const GenerateKeyButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="bg-emerald-800 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4"
  >
    Generate API Key
  </button>
);

export default GenerateKeyButton;

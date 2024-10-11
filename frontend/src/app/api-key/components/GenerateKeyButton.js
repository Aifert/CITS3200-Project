const GenerateKeyButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="bg-orange-400 hover:bg-orange:800 text-white font-bold py-2 px-4 rounded mb-4"
  >
    Generate API Key
  </button>
);

export default GenerateKeyButton;

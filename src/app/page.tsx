import HandTracker from '../HandTracker'; // Adjust path if it's in a different folder

export default function Home() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Vital Sign AI</h1>
      
      <div style={{ 
        position: 'relative', 
        width: '640px', 
        height: '480px', 
        border: '2px solid blue' 
      }}>
        <HandTracker />
      </div>
    </main>
  );
}
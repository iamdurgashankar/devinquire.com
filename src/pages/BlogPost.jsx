import { useParams } from "react-router-dom";

export default function BlogPost() {
  const { id } = useParams();
  return (
    <div className="py-16 px-4 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Blog Post</h2>
      <p>Post ID: {id}</p>
      <p>Blog post content will appear here.</p>
    </div>
  );
} 
import { useParams } from "react-router-dom";

export default function Chat() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();

  return (
    <div className="container">
      <h1>
        {owner}/{repo}
      </h1>
    </div>
  );
}

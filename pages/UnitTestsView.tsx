import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CodeBlock } from '../components/CodeBlock';
import { createPRComment } from '../services/githubService';
import { ArrowLeft, Loader2, Check, MessageSquare } from 'lucide-react';

export const UnitTestsView: React.FC = () => {
    const location = useLocation();
    const state = location.state as { prLink: string; code: string; generatedTests: string };

    const [isPosting, setIsPosting] = useState(false);
    const [postSuccess, setPostSuccess] = useState(false);

    const handlePostTests = async () => {
        if (!state.prLink || !state.generatedTests || isPosting || postSuccess) return;

        setIsPosting(true);
        try {
            const comment = `## 🧪 Vibe Check Unit Tests\n\nHere is a generated test suite to verify the requirements:\n\n\`\`\`tsx\n${state.generatedTests}\n\`\`\``;
            await createPRComment(state.prLink, comment);
            setPostSuccess(true);
            setTimeout(() => setPostSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to post comment:', error);
            alert('Failed to post comment to GitHub. Check console.');
        } finally {
            setIsPosting(false);
        }
    };

    if (!state) {
        return (
            <div className="p-8 text-center text-slate-400">
                <p>No test state found.</p>
                <Link to="/session/new" className="text-blue-400 underline">Start New Session</Link>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <header className="bg-vibe-panel border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link to="/session/new" className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-lg font-bold text-white">Generated Unit Tests</h1>
                </div>

                <button
                    onClick={handlePostTests}
                    disabled={isPosting || postSuccess}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${postSuccess
                            ? 'bg-green-600/20 text-green-400 border border-green-600/50'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                >
                    {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : postSuccess ? <Check className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    {postSuccess ? 'Posted to GitHub' : 'Post to GitHub PR'}
                </button>
            </header>

            <div className="flex-1 overflow-auto p-6 bg-[#0d1117]">
                <div className="max-w-4xl mx-auto">
                    <CodeBlock code={state.generatedTests} title="GeneratedTests.test.tsx" />
                </div>
            </div>
        </div>
    );
};

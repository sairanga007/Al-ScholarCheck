import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Star, ThumbsUp, Send, RefreshCw } from 'lucide-react';
import { translations } from '../utils/translate';

export default function CommunityView({ user, token, showToast, lang }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [roleSelection, setRoleSelection] = useState('Student');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [filter, setFilter] = useState('All');

  const t = translations[lang || 'en'];

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/community');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Error fetching community board:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setPosting(true);
    try {
      const res = await fetch('/api/community/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          authorName: user.name,
          role: roleSelection,
          content: content.trim()
        })
      });
      if (res.ok) {
        showToast("Post published successfully!");
        setContent('');
        fetchPosts();
      } else {
        showToast("Failed to publish post.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error connecting to forum service.", "error");
    } finally {
      setPosting(false);
    }
  };

  // Filter posts based on tab
  const filteredPosts = posts.filter(post => {
    if (filter === 'All') return true;
    if (filter === 'Students') return post.role === 'Student';
    if (filter === 'Alumni') return post.role.toLowerCase().includes('alumni');
    if (filter === 'Mentors') return post.role.toLowerCase().includes('mentor');
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Discussion Forum Feed (Left Column) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Post Form */}
        <div className="bg-white border border-outline-variant/35 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-label-md text-label-md text-primary font-bold flex items-center gap-1.5">
            <MessageSquare size={18} className="text-secondary" /> {t.communityTitle}
          </h3>
          <form onSubmit={handlePostSubmit} className="space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.shareExperience}
              className="w-full min-h-[100px] p-4 rounded-xl border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md bg-surface-bright text-on-surface resize-y"
              required
            ></textarea>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              {/* Role selection dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-label-sm text-outline font-semibold">Post as:</span>
                <select
                  value={roleSelection}
                  onChange={(e) => setRoleSelection(e.target.value)}
                  className="text-xs font-semibold bg-surface-container border border-outline-variant/35 rounded-lg py-1.5 px-3 outline-none text-primary cursor-pointer h-9"
                >
                  <option value="Student">{t.roleStudent}</option>
                  <option value="Alumni (JNTU)">{t.roleAlumni} (JNTU)</option>
                  <option value="Alumni (OU)">{t.roleAlumni} (OU)</option>
                  <option value="Mentor (ScholarCheck)">{t.roleMentor}</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={posting || !content.trim()}
                className="bg-primary hover:bg-primary/95 text-on-primary h-9 px-5 rounded-lg font-label-sm text-label-sm flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 transition-colors shrink-0"
              >
                {posting ? 'Posting...' : <><Send size={14} /> {t.postButton}</>}
              </button>
            </div>
          </form>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['All', 'Students', 'Alumni', 'Mentors'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                filter === tab 
                  ? 'bg-secondary text-white border-secondary' 
                  : 'bg-white text-on-surface-variant border-outline-variant/35 hover:bg-surface-container-low'
              }`}
            >
              {tab === 'All' ? 'All Posts' : tab === 'Students' ? t.roleStudent : tab === 'Alumni' ? t.roleAlumni : t.roleMentor}
            </button>
          ))}
        </div>

        {/* Posts Feed */}
        {loading ? (
          <div className="bg-white border border-outline-variant/25 rounded-2xl p-12 text-center text-outline">
            <RefreshCw className="animate-spin mx-auto mb-2 text-secondary" size={24} />
            Loading discussion feed...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white border border-outline-variant/20 rounded-2xl p-12 text-center text-outline">
            No posts found matching filter criteria.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post, idx) => {
              const isAlumni = post.role.toLowerCase().includes('alumni');
              const isMentor = post.role.toLowerCase().includes('mentor');
              
              return (
                <div key={idx} className="bg-white border border-outline-variant/30 rounded-2xl p-5 shadow-xs space-y-3">
                  {/* Author Header */}
                  <div className="flex items-center justify-between border-b pb-2.5 border-outline-variant/15">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary-container/50 text-secondary flex items-center justify-center font-bold text-headline-md">
                        {post.author_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-label-md text-label-md text-primary font-bold leading-tight">{post.author_name}</h4>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 border ${
                          isMentor ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          isAlumni ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {post.role}
                        </span>
                      </div>
                    </div>
                    
                    <span className="text-[10px] text-outline font-semibold">
                      {new Date(post.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {/* Body Content */}
                  <p className="text-body-md text-on-surface-variant leading-relaxed font-medium">
                    {post.content}
                  </p>

                  {/* Likes / Action row */}
                  <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-outline">
                    <button className="flex items-center gap-1.5 hover:text-secondary p-1 rounded transition-colors">
                      <ThumbsUp size={14} />
                      <span>{post.likes || 0} {t.likes}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Right Column: Vetted Alumni Guidelines / Advice */}
      <div className="space-y-6">
        <div className="bg-white border border-outline-variant/35 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-headline-md text-headline-md text-primary font-bold flex items-center gap-2 border-b pb-3 border-outline-variant/20">
            <Users size={20} className="text-secondary" /> Alumni Guidelines
          </h3>
          <div className="space-y-4 text-body-md text-on-surface-variant font-medium">
            <div className="p-3 bg-purple-50/40 border border-purple-100 rounded-xl space-y-1.5">
              <p className="font-bold text-label-md text-purple-800 flex items-center gap-1">
                <Star size={14} fill="currentColor" /> Keep Income Certs Current
              </p>
              <p className="text-label-sm text-purple-950 leading-relaxed">
                "Many government schemes like ePASS reject documents if issued before April of the fiscal year. Renew certificates every single year."
              </p>
              <p className="text-[9px] text-purple-700 text-right">— Rahul, JNTU Alumni</p>
            </div>

            <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl space-y-1.5">
              <p className="font-bold text-label-md text-amber-800 flex items-center gap-1">
                <Star size={14} fill="currentColor" /> NSP Aadhar Seeding
              </p>
              <p className="text-label-sm text-amber-950 leading-relaxed">
                "Enable NPCI mapping on your bank accounts. Many students missed scholarships because payments bounced due to non-seeded Aadhar numbers."
              </p>
              <p className="text-[9px] text-amber-700 text-right">— Priya, Mentor</p>
            </div>

            <div className="p-3 bg-sky-50/40 border border-sky-100 rounded-xl space-y-1.5">
              <p className="font-bold text-label-md text-sky-800 flex items-center gap-1">
                <Star size={14} fill="currentColor" /> Apply Early
              </p>
              <p className="text-label-sm text-sky-950 leading-relaxed">
                "National Scholarship Portal servers get extremely overloaded in the final week. Aim to submit verification docs at least 15 days before deadline."
              </p>
              <p className="text-[9px] text-sky-700 text-right">— Sai, Student Mentor</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

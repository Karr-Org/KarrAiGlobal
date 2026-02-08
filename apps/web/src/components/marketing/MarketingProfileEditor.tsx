'use client';

import { useState, useEffect } from 'react';
import {
    Settings,
    Target,
    Users,
    FileText,
    Hash,
    Clock,
    Brain,
    Save,
    Plus,
    X,
    CheckCircle
} from 'lucide-react';
import { ProductMarketingProfile, Persona, Competitor } from '@/lib/marketing/types';

interface MarketingProfileEditorProps {
    productId: string;
    onSave?: (profile: ProductMarketingProfile) => void;
}

export default function MarketingProfileEditor({ productId, onSave }: MarketingProfileEditorProps) {
    const [profile, setProfile] = useState<Partial<ProductMarketingProfile>>({
        brand_voice: 'Professional yet approachable, technical but clear',
        tone_keywords: ['authoritative', 'helpful', 'innovative'],
        language_style: 'Use active voice, avoid jargon unless explained',
        content_pillars: ['Education', 'Product Features', 'Success Stories', 'Industry News'],
        primary_keywords: [],
        secondary_keywords: [],
        long_tail_keywords: [],
        primary_persona: {
            name: 'Decision Maker',
            pain_points: [],
            goals: [],
            demographics: {}
        },
        competitors: [],
        blog_frequency: '3 per week',
        twitter_frequency: '5 per day',
        linkedin_frequency: '1 per day',
        instagram_frequency: '1 per day',
        posting_timezone: 'Asia/Kolkata',
        require_human_approval: true,
        auto_publish_blogs: false,
        auto_publish_social: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState('brand');

    // New keyword input
    const [newPrimaryKeyword, setNewPrimaryKeyword] = useState('');
    const [newSecondaryKeyword, setNewSecondaryKeyword] = useState('');
    const [newLongTailKeyword, setNewLongTailKeyword] = useState('');
    const [newPainPoint, setNewPainPoint] = useState('');
    const [newGoal, setNewGoal] = useState('');
    const [newPillar, setNewPillar] = useState('');
    const [newToneKeyword, setNewToneKeyword] = useState('');

    useEffect(() => {
        fetchProfile();
    }, [productId]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`/api/marketing/profile?product_id=${productId}`);
            const data = await res.json();
            if (data.profile) {
                setProfile(data.profile);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/marketing/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: productId, ...profile })
            });
            const data = await res.json();
            if (data.profile) {
                setProfile(data.profile);
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
                onSave?.(data.profile);
            }
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setSaving(false);
        }
    };

    const addToArray = (field: keyof ProductMarketingProfile, value: string, setter: (v: string) => void) => {
        if (!value.trim()) return;
        const current = (profile[field] as string[]) || [];
        if (!current.includes(value.trim())) {
            setProfile({ ...profile, [field]: [...current, value.trim()] });
        }
        setter('');
    };

    const removeFromArray = (field: keyof ProductMarketingProfile, value: string) => {
        const current = (profile[field] as string[]) || [];
        setProfile({ ...profile, [field]: current.filter(v => v !== value) });
    };

    const addPainPoint = () => {
        if (!newPainPoint.trim()) return;
        const persona = profile.primary_persona || { name: '', pain_points: [], goals: [], demographics: {} };
        setProfile({
            ...profile,
            primary_persona: {
                ...persona,
                pain_points: [...(persona.pain_points || []), newPainPoint.trim()]
            }
        });
        setNewPainPoint('');
    };

    const addGoal = () => {
        if (!newGoal.trim()) return;
        const persona = profile.primary_persona || { name: '', pain_points: [], goals: [], demographics: {} };
        setProfile({
            ...profile,
            primary_persona: {
                ...persona,
                goals: [...(persona.goals || []), newGoal.trim()]
            }
        });
        setNewGoal('');
    };

    const sections = [
        { id: 'brand', label: 'Brand Voice', icon: Brain },
        { id: 'audience', label: 'Target Audience', icon: Users },
        { id: 'keywords', label: 'Keywords', icon: Hash },
        { id: 'content', label: 'Content Pillars', icon: FileText },
        { id: 'schedule', label: 'Posting Schedule', icon: Clock },
        { id: 'settings', label: 'Settings', icon: Settings }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-6 h-6 border-2 border-sand-200 border-t-terracotta-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-sand-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-sand-900">Marketing Profile</h2>
                    <p className="text-sm text-sand-500">Configure your AI marketing strategy</p>
                </div>
                <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-sand-800 hover:bg-sand-900 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {saved ? (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            Saved!
                        </>
                    ) : saving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Profile
                        </>
                    )}
                </button>
            </div>

            <div className="flex">
                {/* Sidebar */}
                <div className="w-48 border-r border-sand-100 p-2">
                    {sections.map(section => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === section.id
                                        ? 'bg-terracotta-50 text-terracotta-700'
                                        : 'text-sand-600 hover:bg-sand-50 hover:text-sand-800'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {section.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 p-6 min-h-[500px]">
                    {/* Brand Voice Section */}
                    {activeSection === 'brand' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-sand-700 mb-2">Brand Voice</label>
                                <textarea
                                    value={profile.brand_voice || ''}
                                    onChange={e => setProfile({ ...profile, brand_voice: e.target.value })}
                                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 resize-none"
                                    rows={3}
                                    placeholder="Describe your brand's voice and personality..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-sand-700 mb-2">Tone Keywords</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {(profile.tone_keywords || []).map(keyword => (
                                        <span
                                            key={keyword}
                                            className="px-3 py-1 bg-terracotta-50 text-terracotta-700 rounded-full text-sm flex items-center gap-1"
                                        >
                                            {keyword}
                                            <button
                                                onClick={() => removeFromArray('tone_keywords', keyword)}
                                                className="hover:text-terracotta-900"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={newToneKeyword}
                                        onChange={e => setNewToneKeyword(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && addToArray('tone_keywords', newToneKeyword, setNewToneKeyword)}
                                        className="flex-1 px-4 py-2 border border-sand-200 rounded-xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
                                        placeholder="Add tone keyword..."
                                    />
                                    <button
                                        onClick={() => addToArray('tone_keywords', newToneKeyword, setNewToneKeyword)}
                                        className="px-4 py-2 bg-sand-100 hover:bg-sand-200 text-sand-700 rounded-xl"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-sand-700 mb-2">Language Style</label>
                                <textarea
                                    value={profile.language_style || ''}
                                    onChange={e => setProfile({ ...profile, language_style: e.target.value })}
                                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 resize-none"
                                    rows={2}
                                    placeholder="Describe language preferences..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-sand-700 mb-2">Tagline</label>
                                <input
                                    value={profile.tagline || ''}
                                    onChange={e => setProfile({ ...profile, tagline: e.target.value })}
                                    className="w-full px-4 py-2 border border-sand-200 rounded-xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
                                    placeholder="Your product's tagline..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-sand-700 mb-2">Unique Value Proposition</label>
                                <textarea
                                    value={profile.unique_value_proposition || ''}
                                    onChange={e => setProfile({ ...profile, unique_value_proposition: e.target.value })}
                                    className="w-full px-4 py-3 border border-sand-200 rounded-xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 resize-none"
                                    rows={2}
                                    placeholder="What makes your product unique?"
                                />
                            </div>
                        </div>
                    )}

                    {/* Target Audience Section */}
                    {activeSection === 'audience' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-sand-700 mb-2">Primary Persona Name</label>
                                <input
                                    value={profile.primary_persona?.name || ''}
                                    onChange={e => setProfile({
                                        ...profile,
                                        primary_persona: { ...profile.primary_persona!, name: e.target.value }
                                    })}
                                    className="w-full px-4 py-2 border border-sand-200 rounded-xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
                                    placeholder="e.g., Startup Founder, Enterprise CFO..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-sand-700 mb-2">Pain Points</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {(profile.primary_persona?.pain_points || []).map((point, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm flex items-center gap-1"
                                        >
                                            {point}
                                            <button
                                                onClick={() => {
                                                    const updated = [...(profile.primary_persona?.pain_points || [])];
                                                    updated.splice(i, 1);
                                                    setProfile({
                                                        ...profile,
                                                        primary_persona: { ...profile.primary_persona!, pain_points: updated }
                                                    });
                                                }}
                                                className="hover:text-red-900"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={newPainPoint}
                                        onChange={e => setNewPainPoint(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && addPainPoint()}
                                        className="flex-1 px-4 py-2 border border-sand-200 rounded-xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
                                        placeholder="Add pain point..."
                                    />
                                    <button onClick={addPainPoint} className="px-4 py-2 bg-sand-100 hover:bg-sand-200 text-sand-700 rounded-xl">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-sand-700 mb-2">Goals</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {(profile.primary_persona?.goals || []).map((goal, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm flex items-center gap-1"
                                        >
                                            {goal}
                                            <button
                                                onClick={() => {
                                                    const updated = [...(profile.primary_persona?.goals || [])];
                                                    updated.splice(i, 1);
                                                    setProfile({
                                                        ...profile,
                                                        primary_persona: { ...profile.primary_persona!, goals: updated }
                                                    });
                                                }}
                                                className="hover:text-green-900"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={newGoal}
                                        onChange={e => setNewGoal(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && addGoal()}
                                        className="flex-1 px-4 py-2 border border-sand-200 rounded-xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
                                        placeholder="Add goal..."
                                    />
                                    <button onClick={addGoal} className="px-4 py-2 bg-sand-100 hover:bg-sand-200 text-sand-700 rounded-xl">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Keywords Section */}
                    {activeSection === 'keywords' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-sand-700 mb-2">
                                    Primary Keywords
                                    <span className="text-sand-400 font-normal ml-2">(Main SEO targets)</span>
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {(profile.primary_keywords || []).map(kw => (
                                        <span key={kw} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-1">
                                            {kw}
                                            <button onClick={() => removeFromArray('primary_keywords', kw)} className="hover:text-blue-900">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={newPrimaryKeyword}
                                        onChange={e => setNewPrimaryKeyword(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && addToArray('primary_keywords', newPrimaryKeyword, setNewPrimaryKeyword)}
                                        className="flex-1 px-4 py-2 border border-sand-200 rounded-xl"
                                        placeholder="e.g., startup valuation, DCF calculator..."
                                    />
                                    <button
                                        onClick={() => addToArray('primary_keywords', newPrimaryKeyword, setNewPrimaryKeyword)}
                                        className="px-4 py-2 bg-sand-100 hover:bg-sand-200 text-sand-700 rounded-xl"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-sand-700 mb-2">
                                    Secondary Keywords
                                    <span className="text-sand-400 font-normal ml-2">(Supporting keywords)</span>
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {(profile.secondary_keywords || []).map(kw => (
                                        <span key={kw} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm flex items-center gap-1">
                                            {kw}
                                            <button onClick={() => removeFromArray('secondary_keywords', kw)} className="hover:text-purple-900">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={newSecondaryKeyword}
                                        onChange={e => setNewSecondaryKeyword(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && addToArray('secondary_keywords', newSecondaryKeyword, setNewSecondaryKeyword)}
                                        className="flex-1 px-4 py-2 border border-sand-200 rounded-xl"
                                        placeholder="Add secondary keyword..."
                                    />
                                    <button
                                        onClick={() => addToArray('secondary_keywords', newSecondaryKeyword, setNewSecondaryKeyword)}
                                        className="px-4 py-2 bg-sand-100 hover:bg-sand-200 text-sand-700 rounded-xl"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-sand-700 mb-2">
                                    Long-tail Keywords
                                    <span className="text-sand-400 font-normal ml-2">(Specific phrases)</span>
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {(profile.long_tail_keywords || []).map(kw => (
                                        <span key={kw} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm flex items-center gap-1">
                                            {kw}
                                            <button onClick={() => removeFromArray('long_tail_keywords', kw)} className="hover:text-amber-900">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={newLongTailKeyword}
                                        onChange={e => setNewLongTailKeyword(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && addToArray('long_tail_keywords', newLongTailKeyword, setNewLongTailKeyword)}
                                        className="flex-1 px-4 py-2 border border-sand-200 rounded-xl"
                                        placeholder="e.g., how to value a pre-revenue startup..."
                                    />
                                    <button
                                        onClick={() => addToArray('long_tail_keywords', newLongTailKeyword, setNewLongTailKeyword)}
                                        className="px-4 py-2 bg-sand-100 hover:bg-sand-200 text-sand-700 rounded-xl"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content Pillars Section */}
                    {activeSection === 'content' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-sand-700 mb-2">Content Pillars</label>
                                <p className="text-sm text-sand-500 mb-4">Categories of content you'll create</p>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {(profile.content_pillars || []).map(pillar => (
                                        <span key={pillar} className="px-3 py-2 bg-sand-100 text-sand-700 rounded-xl text-sm flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            {pillar}
                                            <button onClick={() => removeFromArray('content_pillars', pillar)} className="hover:text-sand-900">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={newPillar}
                                        onChange={e => setNewPillar(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && addToArray('content_pillars', newPillar, setNewPillar)}
                                        className="flex-1 px-4 py-2 border border-sand-200 rounded-xl"
                                        placeholder="Add content pillar..."
                                    />
                                    <button
                                        onClick={() => addToArray('content_pillars', newPillar, setNewPillar)}
                                        className="px-4 py-2 bg-sand-100 hover:bg-sand-200 text-sand-700 rounded-xl"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Posting Schedule Section */}
                    {activeSection === 'schedule' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-sand-700 mb-2">Blog Frequency</label>
                                    <select
                                        value={profile.blog_frequency || '3 per week'}
                                        onChange={e => setProfile({ ...profile, blog_frequency: e.target.value })}
                                        className="w-full px-4 py-2 border border-sand-200 rounded-xl"
                                    >
                                        <option value="1 per week">1 per week</option>
                                        <option value="2 per week">2 per week</option>
                                        <option value="3 per week">3 per week</option>
                                        <option value="5 per week">5 per week (daily)</option>
                                        <option value="7 per week">7 per week</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-sand-700 mb-2">Twitter/X Frequency</label>
                                    <select
                                        value={profile.twitter_frequency || '5 per day'}
                                        onChange={e => setProfile({ ...profile, twitter_frequency: e.target.value })}
                                        className="w-full px-4 py-2 border border-sand-200 rounded-xl"
                                    >
                                        <option value="1 per day">1 per day</option>
                                        <option value="3 per day">3 per day</option>
                                        <option value="5 per day">5 per day</option>
                                        <option value="10 per day">10 per day</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-sand-700 mb-2">LinkedIn Frequency</label>
                                    <select
                                        value={profile.linkedin_frequency || '1 per day'}
                                        onChange={e => setProfile({ ...profile, linkedin_frequency: e.target.value })}
                                        className="w-full px-4 py-2 border border-sand-200 rounded-xl"
                                    >
                                        <option value="3 per week">3 per week</option>
                                        <option value="5 per week">5 per week</option>
                                        <option value="1 per day">1 per day</option>
                                        <option value="2 per day">2 per day</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-sand-700 mb-2">Instagram Frequency</label>
                                    <select
                                        value={profile.instagram_frequency || '1 per day'}
                                        onChange={e => setProfile({ ...profile, instagram_frequency: e.target.value })}
                                        className="w-full px-4 py-2 border border-sand-200 rounded-xl"
                                    >
                                        <option value="3 per week">3 per week</option>
                                        <option value="5 per week">5 per week</option>
                                        <option value="1 per day">1 per day</option>
                                        <option value="2 per day">2 per day</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-sand-700 mb-2">Timezone</label>
                                <select
                                    value={profile.posting_timezone || 'Asia/Kolkata'}
                                    onChange={e => setProfile({ ...profile, posting_timezone: e.target.value })}
                                    className="w-full px-4 py-2 border border-sand-200 rounded-xl"
                                >
                                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                    <option value="America/New_York">America/New_York (EST)</option>
                                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                                    <option value="Europe/London">Europe/London (GMT)</option>
                                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Settings Section */}
                    {activeSection === 'settings' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={profile.require_human_approval || false}
                                        onChange={e => setProfile({ ...profile, require_human_approval: e.target.checked })}
                                        className="w-5 h-5 rounded border-sand-300 text-terracotta-600 focus:ring-terracotta-500"
                                    />
                                    <div>
                                        <p className="font-medium text-sand-800">Require Human Approval</p>
                                        <p className="text-sm text-sand-500">Review all AI-generated content before publishing</p>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={profile.auto_publish_blogs || false}
                                        onChange={e => setProfile({ ...profile, auto_publish_blogs: e.target.checked })}
                                        className="w-5 h-5 rounded border-sand-300 text-terracotta-600 focus:ring-terracotta-500"
                                    />
                                    <div>
                                        <p className="font-medium text-sand-800">Auto-Publish Blogs</p>
                                        <p className="text-sm text-sand-500">Automatically publish blogs when scheduled</p>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={profile.auto_publish_social || false}
                                        onChange={e => setProfile({ ...profile, auto_publish_social: e.target.checked })}
                                        className="w-5 h-5 rounded border-sand-300 text-terracotta-600 focus:ring-terracotta-500"
                                    />
                                    <div>
                                        <p className="font-medium text-sand-800">Auto-Publish Social Posts</p>
                                        <p className="text-sm text-sand-500">Automatically post to social media when scheduled</p>
                                    </div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-sand-700 mb-2">AI Model</label>
                                <select
                                    value={profile.ai_model_preference || 'gemini-2.0-flash'}
                                    onChange={e => setProfile({ ...profile, ai_model_preference: e.target.value })}
                                    className="w-full px-4 py-2 border border-sand-200 rounded-xl"
                                >
                                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast)</option>
                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Quality)</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

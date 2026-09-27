import React from 'react';
import { Mail, Github, Linkedin, Globe } from 'lucide-react';
import { TeamMember } from '../data/team';

/** Icon links for one team member; only renders links they actually have. */
export const TeamMemberLinks: React.FC<{ member: TeamMember }> = ({ member }) => (
  <div class="flex items-center gap-2.5 text-slate-500">
    <a href={`mailto:${member.email}`} class="hover:text-slate-200" title={member.email}>
      <Mail class="w-3.5 h-3.5" />
    </a>
    {member.github && (
      <a href={member.github} target="_blank" rel="noopener noreferrer" class="hover:text-slate-200" title="GitHub">
        <Github class="w-3.5 h-3.5" />
      </a>
    )}
    {member.linkedin && (
      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" class="hover:text-slate-200" title="LinkedIn">
        <Linkedin class="w-3.5 h-3.5" />
      </a>
    )}
    {member.portfolio && (
      <a href={member.portfolio} target="_blank" rel="noopener noreferrer" class="hover:text-slate-200" title="Portfolio">
        <Globe class="w-3.5 h-3.5" />
      </a>
    )}
  </div>
);

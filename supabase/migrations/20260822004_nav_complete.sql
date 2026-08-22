-- Make every page reachable from the header.
--
-- Two real gaps. /staff is a core page -- it is where staff, their hours,
-- their skills and their start locations are managed -- and it had no entry at
-- all, reachable only by typing the URL or by an old link. And the four sector
-- pages moved to the top level last week, so the only routes to them were the
-- picker on the home page and the help hub.
--
-- Staff and the sector pages go in the bar and the dropdown respectively. The
-- policy pages go in the dropdown too: they are in the footer, but "linked
-- from the header" should not depend on scrolling to the bottom of a long page
-- to discover a security statement a buyer is looking for.
--
-- The bar keeps six items. A header that lists everything stops being
-- navigation and becomes a list, which is what inMenu exists to avoid.
--
-- Written as a whole-array replacement rather than an append because order
-- matters here and jsonb has no notion of inserting at a position.

update public.site_header
   set layout = jsonb_set(
         layout,
         '{navItems}',
         '[
           {"id": "scheduler",    "text": "Scheduler",    "href": "/scheduler"},
           {"id": "staff",        "text": "Staff",        "href": "/staff"},
           {"id": "calendar",     "text": "Calendar",     "href": "/calendar"},
           {"id": "pricing",      "text": "Pricing",      "href": "/pricing"},
           {"id": "help",         "text": "Help",         "href": "/help"},
           {"id": "how-it-works", "text": "How it works", "href": "/how-it-works"},

           {"id": "care-planning",        "text": "Home care rounds",        "href": "/care-planning",        "inMenu": true},
           {"id": "community-nursing",    "text": "Community nursing",       "href": "/community-nursing",    "inMenu": true},
           {"id": "occupational-therapy", "text": "Occupational therapy",    "href": "/occupational-therapy", "inMenu": true},
           {"id": "physiotherapy",        "text": "Physiotherapy",           "href": "/physiotherapy",        "inMenu": true},

           {"id": "settings",     "text": "Settings",      "href": "/settings",      "inMenu": true},
           {"id": "account",      "text": "Account",       "href": "/account",       "inMenu": true},
           {"id": "feedback",     "text": "Feedback",      "href": "/feedback",      "inMenu": true},

           {"id": "security",     "text": "Security",      "href": "/security",      "inMenu": true},
           {"id": "privacy",      "text": "Privacy",       "href": "/privacy",       "inMenu": true},
           {"id": "terms",        "text": "Terms",         "href": "/terms",         "inMenu": true},
           {"id": "accessibility","text": "Accessibility", "href": "/accessibility", "inMenu": true},

           {"id": "admin",        "text": "Admin",         "href": "#", "inMenu": true, "isAdmin": true}
         ]'::jsonb
       )
 where id = 1;

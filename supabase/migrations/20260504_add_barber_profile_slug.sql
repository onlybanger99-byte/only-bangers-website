alter table barber_profiles
add column if not exists slug text;

create unique index if not exists barber_profiles_slug_unique
on barber_profiles (slug)
where slug is not null;

comment on column barber_profiles.slug is 'Public barber profile slug used for /barbers/[slug] routes.';

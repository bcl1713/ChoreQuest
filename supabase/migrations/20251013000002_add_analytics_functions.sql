create or replace function get_completion_rate_by_template(p_family_id uuid)
returns table (template_id uuid, completion_rate float) as $$
begin
  return query
  select
    qi.template_id,
    (count(*) filter (where qi.status in ('COMPLETED', 'APPROVED')) * 100.0) / count(*)
  from quest_instances qi
  where qi.family_id = p_family_id and qi.template_id is not null
  group by qi.template_id;
end; $$ language plpgsql;

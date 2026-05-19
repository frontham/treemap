CREATE OR REPLACE FUNCTION trees_audit() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_diff jsonb;
  v_op revision_op;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_op := 'create';
    v_diff := to_jsonb(NEW.*);

  ELSIF TG_OP = 'UPDATE' THEN
    v_op := 'update';
    SELECT jsonb_object_agg(o.key, jsonb_build_object('from', o.value, 'to', n.value))
      INTO v_diff
    FROM jsonb_each(to_jsonb(OLD.*)) o
    JOIN jsonb_each(to_jsonb(NEW.*)) n ON o.key = n.key
    WHERE o.value IS DISTINCT FROM n.value;

    IF v_diff IS NULL THEN
      RETURN NEW;  -- no actual change; skip the revision row
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_op := 'delete';
    v_diff := to_jsonb(OLD.*);
  END IF;

  INSERT INTO tree_revisions (tree_id, changed_by, operation, diff)
  VALUES (COALESCE(NEW.id, OLD.id), current_user_id(), v_op, v_diff);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trees_audit_trg
AFTER INSERT OR UPDATE OR DELETE ON trees
FOR EACH ROW EXECUTE FUNCTION trees_audit();

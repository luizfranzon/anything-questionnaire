import type { Study, StudyDetails } from "../../domain/study";

/** Persistence port for Studies. Implemented in the infrastructure layer. */
export interface StudyRepository {
  insert(details: StudyDetails): Promise<Study>;
  /** Most recently created first. */
  findAll(): Promise<Study[]>;
  findById(id: string): Promise<Study | null>;
  /** Returns null when the Study does not exist. */
  update(id: string, details: StudyDetails): Promise<Study | null>;
  delete(id: string): Promise<void>;
}

Feature: Built-in permission access control
  As a system administrator
  I want permissions to be enforced based on user roles
  So that users can only access what they are authorized to do

  Background: Built-in permissions with inheritance
    Given the following built-in permissions exist:
      | permission      | parents                              |
      | category:view   |                                      |
      | category:create | category:view                        |
      | category:edit   | category:view                        |
      | category:delete | category:create, category:edit       |
      | invoice:view    |                                      |
      | invoice:create  | invoice:view                         |
      | invoice:edit    | invoice:view                         |
      | invoice:delete  | invoice:create, invoice:edit         |
      | staff:view      |                                      |
      | staff:create    | staff:view                           |
      | staff:edit      | staff:view                           |
      | staff:delete    | staff:create, staff:edit             |
    And the following roles with permissions exist:
      | role             | permissions                                                          |
      | category_viewer  | category:view                                                        |
      | category_editor  | category:edit                                                        |
      | category_manager | category:delete                                                      |
      | invoice_clerk    | invoice:create                                                       |
      | invoice_editor   | invoice:edit                                                         |
      | invoice_manager  | invoice:delete                                                       |
      | staff_viewer     | staff:view                                                           |
      | staff_hr         | staff:create, staff:edit                                             |
      | staff_admin      | staff:delete                                                         |
      | super_admin      | category:delete, invoice:delete, staff:delete                        |
    And the following users are assigned to roles:
      | user    | roles                          |
      | alice   | category_viewer                |
      | bob     | category_editor                |
      | charlie | category_manager               |
      | diana   | invoice_clerk                  |
      | eve     | invoice_editor                 |
      | frank   | invoice_manager                |
      | grace   | staff_viewer                   |
      | henry   | staff_hr                       |
      | iris    | staff_admin                    |
      | admin   | super_admin                    |
      | jack    | category_viewer, invoice_clerk |
      | karen   |                                |

  # ---------- Direct permission access ----------

  Scenario: Users with direct permissions can access them
    Then the following users should have access:
      | user    | permission      | allowed |
      | alice   | category:view   | yes     |
      | bob     | category:edit   | yes     |
      | charlie | category:delete | yes     |
      | diana   | invoice:create  | yes     |
      | eve     | invoice:edit    | yes     |
      | frank   | invoice:delete  | yes     |
      | grace   | staff:view      | yes     |
      | henry   | staff:create    | yes     |
      | henry   | staff:edit      | yes     |
      | iris    | staff:delete    | yes     |

  # ---------- Inherited permission access ----------

  Scenario: Permission inheritance grants parent permissions
    Then the following users should have access:
      | user    | permission      | allowed |
      | bob     | category:view   | yes     |
      | charlie | category:view   | yes     |
      | charlie | category:create | yes     |
      | charlie | category:edit   | yes     |
      | diana   | invoice:view    | yes     |
      | eve     | invoice:view    | yes     |
      | frank   | invoice:view    | yes     |
      | frank   | invoice:create  | yes     |
      | frank   | invoice:edit    | yes     |
      | henry   | staff:view      | yes     |
      | iris    | staff:view      | yes     |
      | iris    | staff:create    | yes     |
      | iris    | staff:edit      | yes     |

  # ---------- Denied access ----------

  Scenario: Users cannot access permissions not granted to their roles
    Then the following users should have access:
      | user    | permission      | allowed |
      | alice   | category:edit   | no      |
      | alice   | category:create | no      |
      | alice   | category:delete | no      |
      | bob     | category:delete | no      |
      | bob     | category:create | no      |
      | diana   | invoice:edit    | no      |
      | diana   | invoice:delete  | no      |
      | eve     | invoice:create  | no      |
      | eve     | invoice:delete  | no      |
      | grace   | staff:create    | no      |
      | grace   | staff:edit      | no      |
      | grace   | staff:delete    | no      |
      | henry   | staff:delete    | no      |

  # ---------- Cross-module isolation ----------

  Scenario: Permissions do not leak across modules
    Then the following users should have access:
      | user    | permission      | allowed |
      | alice   | invoice:view    | no      |
      | alice   | staff:view      | no      |
      | diana   | category:view   | no      |
      | diana   | staff:view      | no      |
      | grace   | category:view   | no      |
      | grace   | invoice:view    | no      |

  # ---------- User with no roles ----------

  Scenario: User with no roles is denied all permissions
    Then the following users should have access:
      | user  | permission      | allowed |
      | karen | category:view   | no      |
      | karen | category:create | no      |
      | karen | category:edit   | no      |
      | karen | category:delete | no      |
      | karen | invoice:view    | no      |
      | karen | invoice:create  | no      |
      | karen | invoice:edit    | no      |
      | karen | invoice:delete  | no      |
      | karen | staff:view      | no      |
      | karen | staff:create    | no      |
      | karen | staff:edit      | no      |
      | karen | staff:delete    | no      |

  # ---------- Multiple roles ----------

  Scenario: User with multiple roles has combined permissions
    Then the following users should have access:
      | user | permission      | allowed |
      | jack | category:view   | yes     |
      | jack | invoice:create  | yes     |
      | jack | invoice:view    | yes     |
      | jack | category:edit   | no      |
      | jack | invoice:delete  | no      |
      | jack | staff:view      | no      |

  # ---------- Super admin ----------

  Scenario: Super admin has all permissions via inheritance
    Then the following users should have access:
      | user  | permission      | allowed |
      | admin | category:view   | yes     |
      | admin | category:create | yes     |
      | admin | category:edit   | yes     |
      | admin | category:delete | yes     |
      | admin | invoice:view    | yes     |
      | admin | invoice:create  | yes     |
      | admin | invoice:edit    | yes     |
      | admin | invoice:delete  | yes     |
      | admin | staff:view      | yes     |
      | admin | staff:create    | yes     |
      | admin | staff:edit      | yes     |
      | admin | staff:delete    | yes     |
